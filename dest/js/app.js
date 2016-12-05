$(function () {
    // Show/hide errors after validation of Search Form
    // ------------------------------------------------
    _.extend(Backbone.Validation.callbacks, {
        valid: function (view, attr, selector) {
            var $el = view.$('[name=' + attr + ']'),
                $group = $el.closest('.form-group');

            $group.removeClass('has-error');
            $group.find('.help-block').html('').addClass('hidden');
        },
        invalid: function (view, attr, error, selector) {
            var $el = view.$('[name=' + attr + ']'),
                $group = $el.closest('.form-group');

            $group.addClass('has-error');
            $group.find('.help-block').html(error).removeClass('hidden');
        }
    });

    // Search Form Validation Model
    // ----------------------------
    var SearchModel = Backbone.Model.extend({
        validation: {
            owner: [{
                required: true,
                msg: 'The GitHub owner can\'t be blank'
            }, {
                pattern: /^[a-zA-Z]+/,
                msg: 'The GitHub owner must contains only latin symbol'
            }],
            repository: [{
                required: true,
                msg: 'The GitHub repository can\'t be blank'
            }, {
                pattern: /^[a-zA-Z]+/,
                msg: 'The GitHub repository must contains only latin symbol'
            }]
        }
    });

    // Search Form View
    // ----------------
    var SearchForm = Backbone.View.extend({
        events: {
            'click #authButton': function (e) {
                e.preventDefault();
                $('#message').hide();
                this.Auth();
            }
        },

        initialize: function () {
            Backbone.Validation.bind(this);
        },

        Auth: function () {
            var data = this.$el.serializeObject();
            this.model.set(data);

            var owner = this.model.get('owner');
            var repository = this.model.get('repository');

            if (this.model.isValid(true)) {
                var loader = $('header span');
                var tpl_msg = _.template($('#message-template').html());

                loader.toggle();

                $.ajax({
                    type: 'get',
                    url: Api.githubRepositoryUrl + owner + '/' + repository + '/issues',

                    success: function (s) {
                        var html = '';

                        if (s.length > 0) {
                            var tpl_issues = _.template($('#issue-template').html());
                            var tpl_repository = _.template($('#current-repository').html());

                            function htmlencode(str) {
                                return str.replace(/[&<>"']/g, function ($0) {
                                    return "&" + {"&": "amp", "<": "lt", ">": "gt", '"': "quot", "'": "#39"}[$0] + ";";
                                });
                            }

                            _.each(s, function (elt) {
                                var ISOString = elt.created_at;
                                var dateString = ISOString.substring(0, 10);
                                var timeString = ISOString.substring(11, 19);
                                html = html + tpl_issues({
                                    number: elt.number,
                                    title: htmlencode(elt.title),
                                    created_at: dateString + '<br/><i>' + timeString + '</i>'
                                });
                            });
                            $('header').after(tpl_repository({
                                owner: owner,
                                repository: repository,
                                href_owner: Api.githubUrl + owner,
                                href_repository: Api.githubUrl + owner + '/' + repository
                            }));
                            $('#issues ul').html(html);
                            var Issues = new IssueView();
                            App.$el.toggle();
                        } else {
                            App.$el.after(tpl_msg({type: 'warning'}));
                        }
                        loader.toggle();
                    },
                    error: function () {
                        App.$el.after(tpl_msg({type: 'danger'}));
                        loader.toggle();
                    }
                });
            }
        },

        remove: function () {
            Backbone.Validation.unbind(this);
            return Backbone.View.prototype.remove.apply(this, arguments);
        }
    });

    // Serialize data from Search form
    // -------------------------------
    $.fn.serializeObject = function () {
        "use strict";
        var a = {}, b = function (b, c) {
            var d = a[c.name];
            "undefined" != typeof d && d !== null ? $.isArray(d) ? d.push(c.value) : a[c.name] = [d, c.value] : a[c.name] = c.value
        };
        return $.each(this.serializeArray(), b), a
    };

    // Issue Model
    // -----------
    var Issue = Backbone.Model.extend({
        defaults: function () {
            return {
                number: '#',
                title: 'no title',
                created_at: 'unknown'
            }
        }
    });

    // Issue Item View
    // ---------------
    var IssueView = Backbone.View.extend({
        el: $('#issues'),
        model: Issue,

        initialize: function () {
            this.$el.toggle();
        },

        clear: function () {
            this.model.destroy();
        }
    });

    // The Application
    // ---------------
    var Api = {};
    Api.githubRepositoryUrl = 'https://api.github.com/repos/';
    Api.githubUrl = 'https://github.com/';

    var App = new SearchForm({
        el: 'form',
        model: new SearchModel()
    });
});